from typing import Optional
from supabase import create_client, Client
from backend.app.config import settings

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Returns a singleton instance of the Supabase Client.
    Uses the Secret Key (Service Role) on backend to bypass RLS for administrative operations,
    falling back to the publishable/anon key if secret key is not set.
    """
    global _supabase_client
    if _supabase_client is None:
        key = settings.secret_key or settings.public_key
        if not key:
            raise ValueError(
                "Neither SUPABASE_SECRET_KEY nor SUPABASE_PUBLISHABLE_KEY is configured in backend environment."
            )
        _supabase_client = create_client(settings.SUPABASE_URL, key)
    return _supabase_client


def is_database_connected() -> bool:
    """Quick boolean check if Supabase URL and key are configured."""
    return bool(
        settings.SUPABASE_URL
        and "your-project-id" not in settings.SUPABASE_URL
        and (settings.secret_key or settings.public_key)
    )
