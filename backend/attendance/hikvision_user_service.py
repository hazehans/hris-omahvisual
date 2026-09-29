"""Hikvision Device User Management via ISAPI"""
import os
import logging
import requests
from requests.auth import HTTPDigestAuth

logger = logging.getLogger(__name__)

HIKVISION_HOST = os.environ.get('HIKVISION_HOST', '172.16.12.89')
HIKVISION_USER = os.environ.get('HIKVISION_USER', 'admin')
HIKVISION_PASS = os.environ.get('HIKVISION_PASS', 'OmviJosjis2026')

def _auth():
    return HTTPDigestAuth(HIKVISION_USER, HIKVISION_PASS)

def _url(path):
    return f'http://{HIKVISION_HOST}{path}'

# === User Management ===

def search_users(max_results=100):
    """Search/list all users on the device."""
    resp = requests.post(
        _url('/ISAPI/AccessControl/UserInfo/Search?format=json'),
        json={'UserInfoSearchCond': {'searchID': '1', 'searchResultPosition': 0, 'maxResults': max_results}},
        auth=_auth(), timeout=15
    )
    resp.raise_for_status()
    return resp.json().get('UserInfoSearch', {})

def get_user_count():
    """Get user statistics from device."""
    resp = requests.get(
        _url('/ISAPI/AccessControl/UserInfo/Count?format=json'),
        auth=_auth(), timeout=15
    )
    resp.raise_for_status()
    return resp.json().get('UserInfoCount', {})

def push_user_to_device(employee_no, name, begin_time=None, end_time=None, gender='male'):
    """Push/update a user on the Hikvision device."""
    from datetime import datetime, timedelta
    if not begin_time:
        begin_time = datetime.now().strftime('%Y-%m-%dT00:00:00')
    if not end_time:
        end_time = (datetime.now() + timedelta(days=3650)).strftime('%Y-%m-%dT23:59:59')
    
    payload = {
        'UserInfo': {
            'employeeNo': str(employee_no),
            'name': name,
            'userType': 'normal',
            'closeDelayEnabled': False,
            'Valid': {
                'enable': True,
                'beginTime': begin_time,
                'endTime': end_time,
                'timeType': 'local',
            },
            'doorRight': '1',
            'RightPlan': [{'doorNo': 1, 'planTemplateNo': '1'}],
            'gender': gender,
        }
    }
    resp = requests.put(
        _url('/ISAPI/AccessControl/UserInfo/SetUp?format=json'),
        json=payload, auth=_auth(), timeout=15
    )
    resp.raise_for_status()
    return resp.json()

def delete_user_from_device(employee_no):
    """Delete a user from the Hikvision device."""
    payload = {
        'UserInfoDelCond': {
            'EmployeeNoList': [{'employeeNo': str(employee_no)}]
        }
    }
    resp = requests.put(
        _url('/ISAPI/AccessControl/UserInfo/Delete?format=json'),
        json=payload, auth=_auth(), timeout=15
    )
    resp.raise_for_status()
    return resp.json()

# === Card Management ===

def search_cards(max_results=100):
    """Search all cards on device."""
    resp = requests.post(
        _url('/ISAPI/AccessControl/CardInfo/Search?format=json'),
        json={'CardInfoSearchCond': {'searchID': '1', 'searchResultPosition': 0, 'maxResults': max_results}},
        auth=_auth(), timeout=15
    )
    resp.raise_for_status()
    return resp.json().get('CardInfoSearch', {})

def bind_card(employee_no, card_no, card_type='normalCard'):
    """Bind a card to an employee on the device."""
    payload = {
        'CardInfo': {
            'employeeNo': str(employee_no),
            'cardNo': card_no,
            'cardType': card_type,
        }
    }
    resp = requests.put(
        _url('/ISAPI/AccessControl/CardInfo/SetUp?format=json'),
        json=payload, auth=_auth(), timeout=15
    )
    resp.raise_for_status()
    return resp.json()

def unbind_card(card_no):
    """Delete/unbind a card from device."""
    payload = {
        'CardInfoDelCond': {
            'CardNoList': [{'cardNo': card_no}]
        }
    }
    resp = requests.put(
        _url('/ISAPI/AccessControl/CardInfo/Delete?format=json'),
        json=payload, auth=_auth(), timeout=15
    )
    resp.raise_for_status()
    return resp.json()
