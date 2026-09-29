from celery import shared_task
from datetime import date
import logging

logger = logging.getLogger(__name__)

@shared_task(name='attendance.tasks.sync_hikvision_events')
def sync_hikvision_events():
    """Periodic task to fetch events from Hikvision device."""
    from .hikvision_fetcher import fetch_events_from_device
    try:
        result = fetch_events_from_device(target_date=date.today())
        logger.info(f'Hikvision sync completed: {result}')
        return result
    except Exception as e:
        logger.error(f'Hikvision sync failed: {e}')
        raise
