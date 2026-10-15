import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import is_database_connected


@pytest.mark.asyncio
async def test_database_configuration_flag():
    assert is_database_connected() is True


@pytest.mark.asyncio
async def test_db_verify_endpoint_reachable():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/api/db-verify")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "verified"
    assert data["read_verified"] is True
    assert data["write_verified"] is True
    assert "table_counts" in data


@pytest.mark.asyncio
async def test_get_all_entities():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        endpoints = [
            "/api/farmers",
            "/api/produce-batches",
            "/api/buyers",
            "/api/storage-facilities",
            "/api/transport-vehicles",
            "/api/shipments",
        ]
        for ep in endpoints:
            res = await ac.get(ep)
            assert res.status_code == 200, f"Failed on endpoint {ep}: {res.text}"
            data = res.json()
            assert isinstance(data, list)
            assert len(data) > 0


@pytest.mark.asyncio
async def test_create_farmer_write_endpoint():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        new_farmer = {
            "name": "Integration Test Farmer",
            "phone": "+91-9999888877",
            "location": "Test Valley Station",
            "latitude": 19.5,
            "longitude": 73.5,
            "storage_type": "ventilated_shed",
        }
        res = await ac.post("/api/farmers", json=new_farmer)
        assert res.status_code == 201
        created = res.json()
        assert created["name"] == new_farmer["name"]
        assert "id" in created


@pytest.mark.asyncio
async def test_inventory_summary_endpoint():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        res = await ac.get("/api/inventory/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_produce_kg" in data
    assert "avg_remaining_shelf_life_days" in data
    assert "buyer_demand" in data
    assert "storage" in data
    assert "vehicles" in data
    assert data["storage"]["total_capacity_kg"] > 0
    assert data["vehicles"]["total_payload_kg"] > 0


@pytest.mark.asyncio
async def test_produce_batch_lifecycle():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # 1. Fetch a farmer to attach to
        f_res = await ac.get("/api/farmers")
        farmers = f_res.json()
        assert len(farmers) > 0
        farmer_id = farmers[0]["id"]

        # 2. Create batch
        new_batch = {
            "farmer_id": farmer_id,
            "crop_type": "Carrot",
            "quantity_kg": 1500.0,
            "initial_shelf_life_days": 21.0,
            "remaining_shelf_life_days": 21.0,
            "storage_condition": "ventilated_shed",
            "basal_degradation_score": 8.0,
            "status": "harvested",
        }
        create_res = await ac.post("/api/produce-batches", json=new_batch)
        assert create_res.status_code == 201
        batch = create_res.json()
        batch_id = batch["id"]
        assert batch["crop_type"] == "Carrot"

        # 3. Update batch (PATCH)
        patch_res = await ac.patch(
            f"/api/produce-batches/{batch_id}",
            json={"remaining_shelf_life_days": 18.5, "status": "in_storage"},
        )
        assert patch_res.status_code == 200
        updated = patch_res.json()
        assert updated["remaining_shelf_life_days"] == 18.5
        assert updated["status"] == "in_storage"

        # 4. Clean up batch (DELETE)
        del_res = await ac.delete(f"/api/produce-batches/{batch_id}")
        assert del_res.status_code == 200

