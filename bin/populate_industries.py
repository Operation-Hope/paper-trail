import psycopg2
import psycopg2.extras
import os
import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
import app.config as config  # Or 'import test' if this file is in data_scripts
import time

# --- Comprehensive Industry Mapping ---
# This map is designed to be expanded.
# The keys are in uppercase because the script converts all
# donor names and employers to uppercase before matching.


INDUSTRY_KEYWORD_MAP = {
    # -----------------------------------------------------------------
    # PART 1: PAC & CORPORATE NAMES (Exact Match on Donor 'Name')
    # -----------------------------------------------------------------
    
    # --- Health ---
    "AMERICAN MEDICAL ASSOCIATION": "Health Professionals",
    "PFIZER INC": "Pharmaceuticals",
    "ELI LILLY": "Pharmaceuticals",
    "JOHNSON & JOHNSON": "Pharmaceuticals",
    "MERCK & CO": "Pharmaceuticals",
    "AMGEN": "Pharmaceuticals",
    "CVS HEALTH": "Health Services",
    "UNITEDHEALTH GROUP": "Health Services",
    "HCA HEALTHCARE": "Hospitals & Nursing Homes",
    "BLUE CROSS BLUE SHIELD": "Health Services",
    "AMERICAN HOSPITAL ASSOCIATION": "Hospitals & Nursing Homes",
    "AMERISOURCEBERGEN": "Health Services",
    
    # --- Finance, Insurance & Real Estate (FIRE) ---
    "NATIONAL ASSOCIATION OF REALTORS": "Real Estate",
    "BANK OF AMERICA": "Commercial Banks",
    "JPMORGAN CHASE": "Commercial Banks",
    "WELLS FARGO": "Commercial Banks",
    "CITIGROUP": "Commercial Banks",
    "GOLDMAN SACHS": "Securities & Investment",
    "MORGAN STANLEY": "Securities & Investment",
    "BLACKROCK": "Securities & Investment",
    "KKR & CO": "Securities & Investment",
    "AMERICAN BANKERS ASSOCIATION": "Commercial Banks",
    
    # --- Technology & Communications ---
    "AT&T INC": "Telecom Services",
    "VERIZON COMMUNICATIONS": "Telecom Services",
    "COMCAST": "Telecom Services",
    "GOOGLE": "Internet",
    "META": "Internet",
    "AMAZON": "Internet",
    "MICROSOFT": "Internet",
    "APPLE": "Internet",
    "ORACLE": "Internet",
    "INTEL": "Electronics",

    # --- Defense ---
    "LOCKHEED MARTIN": "Defense Aerospace",
    "BOEING CO": "Defense Aerospace",
    "RAYTHEON": "Defense Aerospace",
    "NORTHROP GRUMMAN": "Defense Aerospace",
    "GENERAL DYNAMICS": "Defense Aerospace",

    # --- Energy & Natural Resources ---
    "EXXON MOBIL": "Oil & Gas",
    "CHEVRON": "Oil & Gas",
    "NEXTERA ENERGY": "Electric Utilities",
    "DUKE ENERGY": "Electric Utilities",
    "AMERICAN GAS ASSOCIATION": "Gas Utilities",
    "KOCH INDUSTRIES": "Oil & Gas",

    # --- Other Major PACs / Corporations ---
    "NATIONAL ASSOCIATION OF REALTORS": "Real Estate",
    "AMERICAN ISRAEL PUBLIC AFFAIRS CMTE": "Pro-Israel", # Example of an issue-based group

    # -----------------------------------------------------------------
    # PART 2: EMPLOYER KEYWORDS (Partial Match on 'Employer')
    # -----------------------------------------------------------------
    # These are more general. Order matters!
    # Put more specific keywords (like 'LAW FIRM') before
    # more general ones (like 'LAW').
    
    # --- Health ---
    "HOSPITAL": "Hospitals & Nursing Homes",
    "HEALTHCARE": "Health Services",
    "HEALTH": "Health Services",
    "PHYSICIAN": "Health Professionals",
    "MEDICAL CENTER": "Hospitals & Nursing Homes",
    "PHARMACEUTICAL": "Pharmaceuticals",

    # --- Finance, Insurance & Real Estate (FIRE) ---
    "BANK": "Commercial Banks",
    "INVESTMENTS": "Securities & Investment",
    "FINANCIAL": "Finance",
    "VENTURES": "Securities & Investment",
    "CAPITAL": "Securities & Investment",
    "REALTY": "Real Estate",
    "REAL ESTATE": "Real Estate",
    "INSURANCE": "Insurance",

    # --- Law & Lobbying ---
    "LAW FIRM": "Lawyers & Lobbyists",
    "ATTORNEY": "Lawyers & Lobbyists",
    "LAW": "Lawyers & Lobbyists",
    "LLP": "Lawyers & Lobbyists", # Common suffix for law firms
    "PLLC": "Lawyers & Lobbyists",

    # --- Education ---
    "UNIVERSITY": "Education",
    "COLLEGE": "Education",
    "SCHOOL DISTRICT": "Education",
    "PUBLIC SCHOOLS": "Education",
    "EDUCATION": "Education",

    # --- Tech & Communications ---
    "SOFTWARE": "Internet",
    "TECHNOLOGY": "Internet",
    
    # --- Other / General Business ---
    "CONSULTING": "Consulting",
    "MANAGEMENT": "Business Services",
    "EXECUTIVE": "Business Services",
    "GLOBAL": "Business Services",
    
    # --- Self-Reported / Government ---
    "SELF-EMPLOYED": "Other",
    "SELF": "Other",
    "U.S. GOVERNMENT": "Government",
    "US GOVERNMENT": "Government",
    "STATE OF": "Government",
    
    # --- ** KEYWORDS FOR "NONE" ** ---
    # These are crucial. FEC data is full of these.
    # Map them to an 'Other' or 'Non-Employed' category.
    "RETIRED": "Retired",
    "NOT EMPLOYED": "Non-Employed",
    "NONE": "Non-Employed",
    "N/A": "Non-Employed",
    "HOMEMAKER": "Non-Employed",
    
}

# --- Database Connection ---
def get_db_connection():
    """Establishes database connection using params from data_scripts/test.py"""
    # If populate_industries.py is IN the data_scripts folder, use:
    # conn = psycopg2.connect(**test.conn_params)
    
    # If populate_industries.py is in the ROOT folder (with app.py), use:
    conn = psycopg2.connect(**config.conn_params)
    return conn

# --- Main Update Function ---
def populate_donor_industries():
    """
    Fetches donors with no industry and attempts to assign one
    based on the INDUSTRY_KEYWORD_MAP.
    """
    conn = None
    updated_count = 0
    start_time = time.time()
    donors_to_update = [] # List to hold (industry, donor_id) tuples

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        print("Fetching donors with NULL industry...")
        cur.execute("SELECT DonorID, Name, Employer, DonorType FROM Donors WHERE Industry IS NULL;")
        donors_without_industry = cur.fetchall()
        print(f"Found {len(donors_without_industry)} donors to process.")

        # --- Matching Logic ---
        print("Attempting to match donors to industries...")
        processed_count = 0
        
        # Create a copy of map keys in uppercase.
        # This is redundant since we defined them in uppercase, but it's safe.
        map_upper = {key.upper(): val for key, val in INDUSTRY_KEYWORD_MAP.items()}
        
        # Separate keys for exact 'Name' matching vs. partial 'Employer' matching
        # This is a more advanced approach but for simplicity, we'll just check all.
        # For better accuracy, you'd separate PACs (Part 1) from Keywords (Part 2)
        
        for donor in donors_without_industry:
            processed_count += 1
            if processed_count % 1000 == 0:
                print(f"  Processed {processed_count}/{len(donors_without_industry)}...", end='\r')

            donor_id = donor['donorid']
            donor_name = str(donor['name'] or '').upper() 
            employer = str(donor['employer'] or '').upper()
            donor_type = donor['donortype']
            matched_industry = None

            # 1. Try exact match on Name (good for PACs/Companies)
            if donor_name in map_upper:
                matched_industry = map_upper[donor_name]
            
            # 2. If no name match, try keyword matching on Employer
            # This is better for 'Individual' donors
            elif employer:
                 for keyword, industry in map_upper.items():
                     # Use 'in' for partial matching
                     # This is why order matters. 'BANK OF AMERICA' will match 'BANK'.
                     if keyword in employer:
                         matched_industry = industry
                         break # Take the first match

            # If we found a match, add it to our list for batch update
            if matched_industry:
                donors_to_update.append((matched_industry, donor_id))

        print(f"\nFound potential industry matches for {len(donors_to_update)} donors.")

        # --- Batch Update ---
        # --- Batch Update ---
        if donors_to_update:
            print("Performing batch update...")
            update_sql = "UPDATE Donors SET Industry = %s WHERE DonorID = %s;"
            
            # Use execute_batch for efficiency
            psycopg2.extras.execute_batch(
                cur,
                update_sql,
                donors_to_update,
                page_size=500 # Adjust batch size as needed
            )
            
            conn.commit()
            updated_count = len(donors_to_update)
            print(f"Batch update committed. {updated_count} rows updated.")
        else:
            print("No new industries assigned in this run.")

    except (Exception, psycopg2.Error) as e:
        print(f"\nAn error occurred: {e}")
        if conn:
            conn.rollback() 
    finally:
        if conn:
            cur.close()
            conn.close()
            print("Database connection closed.")

    end_time = time.time()
    print(f"\n--- Populate Complete ---")
    print(f"Assigned industries to {updated_count} donors.")
    print(f"Total time: {end_time - start_time:.2f} seconds.")

# --- Run the script ---
if __name__ == "__main__":
    populate_donor_industries()