import requests
import time
import random
from faker import Faker
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('traffic-bot')

fake = Faker()

SERVICES = {
    'user': 'http://user:3001',
    'product': 'http://product:3002',
    'order': 'http://order:3003',
    'payment': 'http://payment:3004',
    'notification': 'http://notification:3005'
}

def create_user():
    try:
        data = {
            'username': fake.user_name(),
            'email': fake.email()
        }
        response = requests.post(f"{SERVICES['user']}/api/users", json=data)
        if response.status_code == 200:
            logger.info(f"Created user: {data['username']}")
            return response.json()
        else:
            logger.error(f"Failed to create user: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return None

def get_user(user_id):
    try:
        response = requests.get(f"{SERVICES['user']}/api/users/{user_id}")
        if response.status_code == 200:
            logger.info(f"Retrieved user: {user_id}")
            return response.json()
        else:
            logger.warn(f"Failed to get user: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error getting user: {str(e)}")
        return None

def simulate_traffic():
    while True:
        try:
            time.sleep(random.uniform(1, 5))
            
            action = random.choice(['create_user', 'get_user'])
            
            if action == 'create_user':
                user = create_user()
                if user:
                    time.sleep(random.uniform(0.5, 2))
                    get_user(user['id'])
            
            elif action == 'get_user':
                fake_id = fake.uuid4()
                get_user(fake_id)
            
            if random.random() < 0.1:
                logger.warning("Simulating network error")
                time.sleep(random.uniform(2, 5))
            
        except Exception as e:
            logger.error(f"Error in traffic simulation: {str(e)}")
            time.sleep(5)

if __name__ == "__main__":
    logger.info("Starting traffic bot...")
    simulate_traffic() 