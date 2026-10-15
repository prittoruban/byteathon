from typing import Optional, Literal
from datetime import datetime, date
from pydantic import BaseModel, Field


# -------------------------------------------------------------
# 1. Farmer Models
# -------------------------------------------------------------
StorageType = Literal["ambient_heap", "ventilated_shed", "cold_storage"]


class FarmerBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Ramesh Patel"})
    phone: Optional[str] = Field(None, json_schema_extra={"example": "+91-9876543210"})
    location: str = Field(..., json_schema_extra={"example": "Nashik Cluster North"})
    latitude: Optional[float] = Field(None, json_schema_extra={"example": 19.9975})
    longitude: Optional[float] = Field(None, json_schema_extra={"example": 73.7898})
    storage_type: StorageType = Field(default="ambient_heap")


class FarmerCreate(FarmerBase):
    pass


class Farmer(FarmerBase):
    id: str
    created_at: Optional[datetime] = None


# -------------------------------------------------------------
# 2. Produce Batch Models
# -------------------------------------------------------------
BatchStatus = Literal[
    "harvested", "in_storage", "in_transit", "delivered", "spoiled", "diverted"
]


class ProduceBatchBase(BaseModel):
    farmer_id: str
    crop_type: str = Field(..., json_schema_extra={"example": "Tomato"})
    quantity_kg: float = Field(..., ge=0, json_schema_extra={"example": 4000.0})
    harvest_date: Optional[date] = None
    initial_shelf_life_days: float = Field(..., gt=0, json_schema_extra={"example": 10.0})
    remaining_shelf_life_days: float = Field(..., ge=0, json_schema_extra={"example": 8.5})
    storage_condition: StorageType = Field(default="ambient_heap")
    basal_degradation_score: float = Field(default=0.0, ge=0)
    status: BatchStatus = Field(default="harvested")


class ProduceBatchCreate(ProduceBatchBase):
    pass


class ProduceBatchUpdate(BaseModel):
    quantity_kg: Optional[float] = Field(None, ge=0)
    remaining_shelf_life_days: Optional[float] = Field(None, ge=0)
    storage_condition: Optional[StorageType] = None
    basal_degradation_score: Optional[float] = Field(None, ge=0)
    status: Optional[BatchStatus] = None


class ProduceBatch(ProduceBatchBase):
    id: str
    created_at: Optional[datetime] = None


# -------------------------------------------------------------
# 3. Buyer Models
# -------------------------------------------------------------
BuyerType = Literal["primary_retail", "secondary_processor"]


class BuyerBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "FreshMart Hypermarket"})
    type: BuyerType = Field(default="primary_retail")
    location: str = Field(..., json_schema_extra={"example": "Mumbai Central Hub"})
    latitude: Optional[float] = Field(None, json_schema_extra={"example": 19.0760})
    longitude: Optional[float] = Field(None, json_schema_extra={"example": 72.8777})
    demand_crop: str = Field(..., json_schema_extra={"example": "Tomato"})
    demand_kg: float = Field(..., ge=0, json_schema_extra={"example": 4000.0})
    offered_price_per_kg: float = Field(..., gt=0, json_schema_extra={"example": 42.0})
    quality_threshold_min_shelf_life_hours: float = Field(default=24.0, ge=0)


class BuyerCreate(BuyerBase):
    pass


class Buyer(BuyerBase):
    id: str
    created_at: Optional[datetime] = None


# -------------------------------------------------------------
# 4. Storage Facility Models
# -------------------------------------------------------------
class StorageFacilityBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Kisan Cold Chain Terminal A"})
    location: str = Field(..., json_schema_extra={"example": "Nashik Logistics Corridor"})
    latitude: Optional[float] = Field(None, json_schema_extra={"example": 20.0010})
    longitude: Optional[float] = Field(None, json_schema_extra={"example": 73.8100})
    total_capacity_kg: float = Field(..., gt=0, json_schema_extra={"example": 50000.0})
    current_utilization_kg: float = Field(default=0.0, ge=0, json_schema_extra={"example": 18500.0})
    temperature_celsius: float = Field(default=4.0, json_schema_extra={"example": 4.0})
    humidity_pct: float = Field(default=85.0, ge=0, le=100, json_schema_extra={"example": 88.0})
    cost_per_kg_per_day: float = Field(default=0.50, ge=0, json_schema_extra={"example": 0.40})


class StorageFacilityCreate(StorageFacilityBase):
    pass


class StorageFacility(StorageFacilityBase):
    id: str
    created_at: Optional[datetime] = None


# -------------------------------------------------------------
# 5. Transport Vehicle Models
# -------------------------------------------------------------
VehicleStatus = Literal["idle", "in_transit", "loading", "maintenance"]


class TransportVehicleBase(BaseModel):
    vehicle_number: str = Field(..., json_schema_extra={"example": "MH-15-TC-1088"})
    driver_name: Optional[str] = Field(None, json_schema_extra={"example": "Anil Shinde"})
    driver_phone: Optional[str] = Field(None, json_schema_extra={"example": "+91-9922001122"})
    max_payload_kg: float = Field(..., gt=0, json_schema_extra={"example": 5000.0})
    is_refrigerated: bool = Field(default=False)
    current_temp_celsius: float = Field(default=24.0, json_schema_extra={"example": 8.5})
    current_humidity_pct: float = Field(default=65.0, json_schema_extra={"example": 80.0})
    current_latitude: Optional[float] = Field(None, json_schema_extra={"example": 19.9800})
    current_longitude: Optional[float] = Field(None, json_schema_extra={"example": 73.7900})
    cost_per_km: float = Field(default=15.0, gt=0, json_schema_extra={"example": 22.0})
    status: VehicleStatus = Field(default="idle")


class TransportVehicleCreate(TransportVehicleBase):
    pass


class TransportVehicle(TransportVehicleBase):
    id: str
    created_at: Optional[datetime] = None


# -------------------------------------------------------------
# 6. Shipment Models
# -------------------------------------------------------------
ShipmentStatus = Literal[
    "scheduled", "in_transit", "rerouted", "delivered", "spoiled"
]
OriginType = Literal["farmer", "storage_facility"]


class ShipmentBase(BaseModel):
    batch_id: str
    vehicle_id: str
    origin_type: OriginType = Field(default="farmer")
    origin_id: str
    destination_buyer_id: str
    original_buyer_id: Optional[str] = None
    allocated_quantity_kg: float = Field(..., gt=0, json_schema_extra={"example": 4000.0})
    transit_distance_km: float = Field(default=0.0, ge=0, json_schema_extra={"example": 168.0})
    estimated_transit_hours: float = Field(default=0.0, ge=0, json_schema_extra={"example": 4.5})
    current_spoilage_risk_score: float = Field(
        default=0.0, ge=0, le=100, json_schema_extra={"example": 14.2}
    )
    status: ShipmentStatus = Field(default="scheduled")
    reroute_reason: Optional[str] = None


class ShipmentCreate(ShipmentBase):
    pass


class Shipment(ShipmentBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
