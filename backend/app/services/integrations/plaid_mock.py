import asyncio
import random
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone

class PlaidMockService:
    """
    A mock implementation of the Plaid API for local development and testing.
    Simulates the latency and data structure of Plaid without real API calls.
    """

    @staticmethod
    async def create_link_token(user_id: str) -> Dict[str, str]:
        """Simulates creating a Plaid Link token."""
        await asyncio.sleep(0.5)
        return {"link_token": f"link-sandbox-{random.randint(1000000, 9999999)}"}

    @staticmethod
    async def exchange_public_token(public_token: str) -> Dict[str, str]:
        """Simulates exchanging a public token for an access token."""
        await asyncio.sleep(0.8)
        return {
            "access_token": f"access-sandbox-{random.randint(1000000, 9999999)}",
            "item_id": f"item-{random.randint(1000, 9999)}"
        }

    @staticmethod
    async def get_accounts(access_token: str) -> List[Dict[str, Any]]:
        """Simulates fetching linked accounts (checking, savings, credit)."""
        await asyncio.sleep(1.2)
        return [
            {
                "account_id": "acc-1",
                "name": "Plaid Checking",
                "type": "depository",
                "subtype": "checking",
                "balances": {"available": 96000.00, "current": 100000.00, "iso_currency_code": "INR"}
            },
            {
                "account_id": "acc-2",
                "name": "Plaid Savings",
                "type": "depository",
                "subtype": "savings",
                "balances": {"available": 432000.00, "current": 432000.00, "iso_currency_code": "INR"}
            },
            {
                "account_id": "acc-3",
                "name": "Plaid Credit Card",
                "type": "credit",
                "subtype": "credit card",
                "balances": {"available": 640000.00, "current": 36000.00, "limit": 800000.00, "iso_currency_code": "INR"}
            }
        ]

    @staticmethod
    async def sync_transactions(access_token: str, cursor: str = None) -> Dict[str, Any]:
        """Simulates the Plaid Sync endpoint to get new transactions."""
        await asyncio.sleep(1.5)
        
        # Generate some random recent transactions
        now = datetime.now(timezone.utc)
        merchants = ["Uber", "Whole Foods", "Netflix", "Amazon", "Starbucks", "Delta Airlines"]
        categories = ["Transportation", "Food", "Entertainment", "Shopping", "Food", "Travel"]
        
        added = []
        for i in range(5):
            idx = random.randint(0, len(merchants)-1)
            added.append({
                "transaction_id": f"txn-{random.randint(10000, 99999)}",
                "account_id": f"acc-{random.randint(1, 3)}",
                "amount": round(random.uniform(5.0, 150.0), 2),
                "date": (now - timedelta(days=random.randint(0, 14))).strftime("%Y-%m-%d"),
                "name": merchants[idx],
                "merchant_name": merchants[idx],
                "personal_finance_category": {"primary": categories[idx]}
            })

        return {
            "added": added,
            "modified": [],
            "removed": [],
            "next_cursor": f"cursor-{random.randint(1000, 9999)}",
            "has_more": False
        }
