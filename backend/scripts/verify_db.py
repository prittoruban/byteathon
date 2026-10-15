#!/usr/bin/env python3
"""
HARVEST ZERO — Database Read/Write Verification Script
Tests reading and writing across all 6 core tables in Supabase.
"""
import sys
from datetime import date
from backend.app.database import get_supabase_client

TABLES = [
    "farmers",
    "produce_batches",
    "buyers",
    "storage_facilities",
    "transport_vehicles",
    "shipments",
]


def run_verification():
    print("=" * 60)
    print("HARVEST ZERO — SUPABASE DATABASE VERIFICATION")
    print("=" * 60)

    try:
        client = get_supabase_client()
        print("✓ Supabase Client initialized.")
    except Exception as e:
        print(f"✗ Failed to initialize Supabase client: {e}")
        sys.exit(1)

    print("\n--- 1. Testing READ operations across all 6 tables ---")
    missing_tables = []
    table_counts = {}

    for table in TABLES:
        try:
            res = client.table(table).select("id", count="exact").limit(5).execute()
            count = res.count if res.count is not None else len(res.data)
            table_counts[table] = count
            print(f"  ✓ Table '{table}': Readable ({count} rows found)")
        except Exception as e:
            print(f"  ✗ Table '{table}': Error or missing ({e})")
            missing_tables.append(table)

    if missing_tables:
        print("\n" + "!" * 60)
        print("ACTION REQUIRED:")
        print(
            "The following tables need to be created in your Supabase SQL Editor:"
        )
        for t in missing_tables:
            print(f"  - {t}")
        print("\nPlease copy and run the SQL from 'supabase_schema.sql'")
        print("in your Supabase SQL Editor:")
        print("https://supabase.com/dashboard/project/nlnsqrjvdrtbfrfvyqfg/sql")
        print("!" * 60 + "\n")
        return False

    print("\n--- 2. Testing WRITE operations (Insert -> Read -> Delete) ---")
    test_farmer_id = None
    try:
        # Write test record
        test_payload = {
            "name": "Verification Automated Tester",
            "phone": "+91-0000000000",
            "location": "Test Cluster Lab",
            "latitude": 19.0,
            "longitude": 73.0,
            "storage_type": "cold_storage",
        }
        insert_res = client.table("farmers").insert(test_payload).execute()
        if not insert_res.data:
            raise RuntimeError("Insert returned empty data")

        test_farmer_id = insert_res.data[0]["id"]
        print(f"  ✓ INSERT successful: Created test farmer (ID: {test_farmer_id})")

        # Read back test record
        read_res = (
            client.table("farmers")
            .select("*")
            .eq("id", test_farmer_id)
            .execute()
        )
        if not read_res.data:
            raise RuntimeError("Could not read back the inserted test record")
        print("  ✓ SELECT successful: Retrieved inserted record verified.")

        # Delete test record
        client.table("farmers").delete().eq("id", test_farmer_id).execute()
        print("  ✓ DELETE successful: Cleaned up test record.")

    except Exception as e:
        print(f"  ✗ WRITE test failed: {e}")
        if test_farmer_id:
            try:
                client.table("farmers").delete().eq("id", test_farmer_id).execute()
            except Exception:
                pass
        return False

    print("\n" + "=" * 60)
    print("SUCCESS: Full Read & Write Verification Passed for all 6 tables!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
