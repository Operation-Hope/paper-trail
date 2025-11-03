"""Fix duplicate bill numbers in seed data."""

import re

with open('tests/fixtures/seed_data.py', 'r') as f:
    content = f.read()

# Find duplicate bill numbers and their line numbers
lines = content.split('\n')
bill_occurrences = {}

for i, line in enumerate(lines, 1):
    match = re.search(r'"([HS]\.[R\.]*\d+)"', line)
    if match:
        bill_num = match.group(1)
        if bill_num not in bill_occurrences:
            bill_occurrences[bill_num] = []
        bill_occurrences[bill_num].append((i, line))

# Find duplicates
duplicates = {k: v for k, v in bill_occurrences.items() if len(v) > 1}

print("Duplicates found:")
for bill, occurrences in duplicates.items():
    print(f"\n{bill}:")
    for line_num, line in occurrences:
        print(f"  Line {line_num}: {line.strip()}")

# Fix duplicates by replacing second occurrences
replacements = {
    ('H.R.1', 2): 'H.R.2000',  # Second occurrence of H.R.1
    ('H.R.2', 2): 'H.R.2001',  # Second occurrence of H.R.2
    ('H.R.6', 2): 'H.R.2002',  # Second occurrence of H.R.6
    ('S.1', 2): 'S.2000',      # Second occurrence of S.1
}

for (bill, occurrence_num), new_bill in replacements.items():
    if bill in bill_occurrences and len(bill_occurrences[bill]) >= occurrence_num:
        line_num, old_line = bill_occurrences[bill][occurrence_num - 1]
        idx = line_num - 1
        lines[idx] = old_line.replace(f'"{bill}"', f'"{new_bill}"')
        print(f"\nReplacing {bill} -> {new_bill} at line {line_num}")

# Write fixed content
with open('tests/fixtures/seed_data.py', 'w') as f:
    f.write('\n'.join(lines))

print("\n✓ Fixed all duplicates")
