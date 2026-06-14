import asyncio
import logging
from app.tasks.celery_app import celery_app
from app.services.integrations.plaid_mock import PlaidMockService

logger = logging.getLogger(__name__)

@celery_app.task(name="sync_bank_accounts")
def sync_bank_accounts(user_id: str, access_token: str):
    """Background task to sync bank transactions from Plaid."""
    logger.info(f"Starting bank sync for user {user_id}")
    
    # Run async function in sync context
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    try:
        transactions_data = loop.run_until_complete(PlaidMockService.sync_transactions(access_token))
        logger.info(f"Synced {len(transactions_data['added'])} new transactions for user {user_id}")
        
        # Here we would normally save to the DB and trigger AI categorization
        # For now, we simulate processing
        loop.run_until_complete(asyncio.sleep(2))
        
        logger.info(f"Finished processing transactions for user {user_id}")
        return {"status": "success", "synced_count": len(transactions_data["added"])}
    except Exception as e:
        logger.error(f"Error syncing bank accounts for user {user_id}: {str(e)}")
        raise e

@celery_app.task(name="process_financial_document")
def process_financial_document(user_id: str, file_path: str, document_type: str):
    """Background task to extract data from uploaded PDFs/CSVs."""
    logger.info(f"Processing document {file_path} for user {user_id}")
    import time
    
    # Simulate OCR and data extraction delay
    time.sleep(5)
    
    logger.info(f"Successfully processed {document_type} document for user {user_id}")
    return {"status": "success", "file": file_path, "parsed_transactions": 24}

@celery_app.task(name="generate_monthly_report")
def generate_monthly_report(user_id: str, month: int, year: int):
    """Generates PDF/CSV report for the user's monthly finances."""
    logger.info(f"Generating report for user {user_id} for {month}/{year}")
    import time
    time.sleep(3) # Simulate PDF generation
    logger.info(f"Report generated successfully for user {user_id}")
    return {"status": "success", "report_url": f"/downloads/{user_id}/report_{year}_{month}.pdf"}
