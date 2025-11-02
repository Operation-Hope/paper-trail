import os
import zipfile
import io
import csv
import psycopg2
import time
from psycopg2.extras import execute_values
import re
from app.config import conn_params # Imports your configuration file

# --- CONFIGURATION ---
# All config is now pulled from test.py
FEC_DATA_FOLDER_PATH = config.FEC_DATA_FOLDER_PATH
BATCH_SIZE = 500

# --- STATE ABBREVIATION MAP ---
# This maps the FEC's 2-letter abbreviation to the full state name used by Congress.gov
STATE_ABBREVIATION_MAP = {
    'AL': 'alabama', 'AK': 'alaska', 'AS': 'american samoa', 'AZ': 'arizona', 'AR': 'arkansas',
    'CA': 'california', 'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware', 'DC': 'district of columbia',
    'FL': 'florida', 'GA': 'georgia', 'GU': 'guam', 'HI': 'hawaii', 'ID': 'idaho',
    'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa', 'KS': 'kansas', 'KY': 'kentucky',
    'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland', 'MA': 'massachusetts', 'MI': 'michigan',
    'MN': 'minnesota', 'MS': 'mississippi', 'MO': 'missouri', 'MT': 'montana', 'NE': 'nebraska',
    'NV': 'nevada', 'NH': 'new hampshire', 'NJ': 'new jersey', 'NM': 'new mexico', 'NY': 'new york',
    'NC': 'north carolina', 'ND': 'north dakota', 'MP': 'northern mariana islands', 'OH': 'ohio', 'OK': 'oklahoma',
    'OR': 'oregon', 'PA': 'pennsylvania', 'PR': 'puerto rico', 'RI': 'rhode island', 'SC': 'south carolina',
    'SD': 'south dakota', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont',
    'VI': 'virgin islands', 'VA': 'virginia', 'WA': 'washington', 'WV': 'west virginia',
    'WI': 'wisconsin', 'WY': 'wyoming'
}
STATE_ABBREVIATION_MAP.update({k.lower(): v for k, v in STATE_ABBREVIATION_MAP.items()})


# --- Global Lookup ---
# { (lower_lastname, lower_full_state_name): [ (PoliticianID, cleaned_first_name), ... ] }
politician_db_lookup = {}

# --- FEC Headers ---
CN_HEADERS = ['CAND_ID', 'CAND_NAME', 'CAND_PTY_AFFILIATION', 'CAND_ELECTION_YR', 'CAND_OFFICE_ST', 'CAND_OFFICE', 'CAND_OFFICE_DISTRICT']

def clean_name_part(name_part):
    """Aggressively cleans a name part to its simplest form."""
    if not name_part: return ""
    name = str(name_part).lower().strip()
    name = re.sub(r"[.,\(\)]", " ", name) # Replace punctuation with space
    name = re.sub(r"\s+(jr|sr|ii|iii|iv|md|phd)$", "", name, flags=re.IGNORECASE) # Remove suffixes
    name = name.split(' ')[0].strip()
    return name

def normalize_fec_name(name_str):
    """Cleans FEC name data, e.g., 'PELOSI, NANCY P (DEM)' -> ('nancy', 'pelosi')."""
    name = str(name_str or '').strip().lower()
    name = re.sub(r"\s*\([drpi].*\)$", "", name).strip() # Remove (DEM), (REP)
    cleaned_fname = ""; cleaned_lname = ""
    if ',' in name:
        parts = name.split(',', 1)
        cleaned_lname = clean_name_part(parts[0])
        cleaned_fname = clean_name_part(parts[1])
    else:
        parts = name.split()
        if len(parts) > 1:
            cleaned_fname = clean_name_part(parts[0])
            cleaned_lname = clean_name_part(parts[-1]) # Assume last part is last name
        elif len(parts) == 1:
            cleaned_lname = clean_name_part(parts[0])
    return (cleaned_fname, cleaned_lname)

def create_fec_map_table_if_not_exists(conn):
    """Creates the fec_politician_map table if it doesn't already exist."""
    print("Ensuring 'fec_politician_map' table exists...")
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS fec_politician_map (
                fec_candidate_id TEXT PRIMARY KEY,
                politician_id INT REFERENCES Politicians(PoliticianID) ON DELETE CASCADE
            );
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_fec_map_politician_id ON fec_politician_map (politician_id);")
        conn.commit()
        print("Table 'fec_politician_map' is ready.")
    except Exception as e:
        print(f"Error creating table: {e}"); conn.rollback(); raise e

def load_politician_lookup(conn):
    """Loads Politicians from DB, storing a cleaned first name for matching."""
    global politician_db_lookup; cur = conn.cursor();
    print("Loading Politicians lookup from DB (Aggressive Clean)...");
    cur.execute("SELECT PoliticianID, FirstName, LastName, State, Role FROM Politicians") # Added Role
    
    for row in cur.fetchall():
        pid, fname, lname, state, role = row
        
        cleaned_fname = clean_name_part(fname)
        cleaned_lname = clean_name_part(lname)
        cleaned_state = str(state or '').strip().lower() # e.g., 'north carolina'
        
        # Use a special state key for presidents
        if role == 'President':
             cleaned_state = 'us_president'
             
        key = (cleaned_lname, cleaned_state) # Key = (lastname, full_state_name)
        
        if key not in politician_db_lookup:
            politician_db_lookup[key] = []
        # Store pid, cleaned_fname, and role for better matching
        politician_db_lookup[key].append( (pid, cleaned_fname, role) ) 
        
    print(f"Loaded {len(politician_db_lookup)} unique (LastName, State) keys."); cur.close()

def build_mapping_table():
    """Reads cn.zip files, matches to DB, and populates fec_politician_map."""
    conn = None
    try:
        # Connect using the details from test.py
        print("Connecting to PostgreSQL..."); conn = psycopg2.connect(**config.conn_params) 
        
        create_fec_map_table_if_not_exists(conn)
        load_politician_lookup(conn) 
        cur = conn.cursor()
        
        print("Clearing old mapping data...");
        cur.execute("DELETE FROM fec_politician_map;");
        conn.commit()

        cn_files = sorted([f for f in os.listdir(FEC_DATA_FOLDER_PATH) if f.startswith('cn') and f.endswith('.zip')])
        if not cn_files:
            print(f"Error: 'cn.zip' files not found in '{FEC_DATA_FOLDER_PATH}'."); return

        print("Building FEC Candidate to PoliticianID map...")
        
        matches_found_count = 0
        unmatched_candidates = set() 
        mapping_to_insert = {} 

        for filename in cn_files:
            filepath = os.path.join(FEC_DATA_FOLDER_PATH, filename)
            print(f"  Processing {filename}...")
            try:
                with zipfile.ZipFile(filepath, 'r') as zf:
                    data_filename = [f for f in zf.namelist() if f.endswith('.txt')][0]
                    with zf.open(data_filename, 'r') as f:
                        reader = csv.reader(io.TextIOWrapper(f, encoding='latin-1'), delimiter='|')
                        for row in reader:
                            try:
                                record = dict(zip(CN_HEADERS, row))
                                cand_id, name_str = record.get('CAND_ID'), record.get('CAND_NAME', '')
                                state_abbr, office = record.get('CAND_OFFICE_ST', '').strip(), record.get('CAND_OFFICE', '')
                                
                                if not (cand_id and name_str and state_abbr and office in ['H', 'S', 'P']):
                                    continue
                                
                                matched_pid = None
                                fname_fec_clean, lname_fec_clean = normalize_fec_name(name_str)
                                
                                if office == 'P' and state_abbr == 'US':
                                    # --- Presidential Match Logic ---
                                    key_fec = (lname_fec_clean, 'us_president')
                                    potential_matches = politician_db_lookup.get(key_fec)
                                    if potential_matches:
                                        if len(potential_matches) == 1:
                                            matched_pid = potential_matches[0][0]
                                        else:
                                            # Match on first name if multiple last names
                                            for pid, fname_db_clean, role in potential_matches:
                                                if fname_fec_clean == fname_db_clean:
                                                    matched_pid = pid; break
                                else:
                                    # --- Congress Match Logic ---
                                    full_state_name = STATE_ABBREVIATION_MAP.get(state_abbr.upper())
                                    if not full_state_name:
                                        continue # Skip if we can't map the state
                                    
                                    key_fec = (lname_fec_clean, full_state_name)
                                    potential_matches = politician_db_lookup.get(key_fec)
                                    
                                    if potential_matches:
                                        if len(potential_matches) == 1:
                                            matched_pid = potential_matches[0][0]
                                        else:
                                            # Match on first name if multiple last names
                                            for pid, fname_db_clean, role in potential_matches:
                                                if fname_fec_clean == fname_db_clean:
                                                    matched_pid = pid; break 
                                
                                if matched_pid:
                                    mapping_to_insert[cand_id] = matched_pid; matches_found_count += 1 
                                else:
                                    unmatched_candidates.add(f"FEC: '{name_str}', {state_abbr}, {office} -> Parsed: ('{fname_fec_clean}', '{lname_fec_clean}')")
                            except: continue
            except Exception as e: print(f"    Warning: Could not process {filename}: {e}")

        mapping_tuples = list(mapping_to_insert.items())
        if mapping_tuples:
            print(f"\nFound {matches_found_count} total matches, resulting in {len(mapping_tuples)} unique FEC ID mappings.")
            print("Inserting into 'fec_politician_map'...")
            sql = "INSERT INTO fec_politician_map (fec_candidate_id, politician_id) VALUES %s ON CONFLICT (fec_candidate_id) DO NOTHING;"
            try:
                execute_values(cur, sql, mapping_tuples, template=None, page_size=BATCH_SIZE)
                conn.commit(); print("Successfully inserted mappings.")
            except psycopg2.Error as e:
                print(f"Error inserting mappings: {e}"); conn.rollback()
        
        print(f"\n--- Mapping Summary ---")
        cur.execute("SELECT COUNT(*) FROM fec_politician_map;"); final_map_count = cur.fetchone()[0]
        print(f"Total unique FEC candidates mapped in DB: {final_map_count}")
        print(f"Total unique FEC candidates we could NOT match: {len(unmatched_candidates)}")

        if unmatched_candidates and final_map_count < 100: # Show examples if mapping seems very low
            print("\n--- Examples of UNMATCHED Candidates (if any remain) ---")
            for i, example in enumerate(list(unmatched_candidates)[:15]): print(example)

    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}");
        if conn: conn.rollback()
    finally:
        if conn:
            try: cur.close()
            except: pass
            conn.close(); print("Database connection closed.")

if __name__ == "__main__":
    build_mapping_table()