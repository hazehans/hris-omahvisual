"""
Custom Exception Handler untuk HRIS OmahVisual.

Mengubah semua error response DRF menjadi format standar:
    {"status": "error", "code": "ERROR_CODE", "message": "Pesan yang dapat dibaca."}
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


# Mapping dari DRF error detail codes ke kode error kustom kita
ERROR_CODE_MAP = {
    'authentication_failed': 'AUTHENTICATION_FAILED',
    'not_authenticated': 'NOT_AUTHENTICATED',
    'permission_denied': 'PERMISSION_DENIED',
    'not_found': 'NOT_FOUND',
    'throttled': 'THROTTLED',
    'token_not_valid': 'TOKEN_NOT_VALID',
}


def custom_exception_handler(exc, context):
    """
    Handler exception kustom. Dipanggil oleh DRF untuk setiap exception.
    Membungkus semua error dalam format standar HRIS.
    """
    # Panggil handler default DRF terlebih dahulu
    response = exception_handler(exc, context)

    if response is not None:
        original_data = response.data

        # Tentukan error code
        code = 'ERROR'
        message = 'Terjadi kesalahan.'

        if isinstance(original_data, dict):
            # Ambil code dari 'detail' jika ada
            detail = original_data.get('detail', '')
            if hasattr(detail, 'code'):
                code = ERROR_CODE_MAP.get(detail.code, detail.code.upper())
                message = str(detail)
            elif 'detail' in original_data:
                message = str(original_data['detail'])
            else:
                # Validation errors: kumpulkan semua field errors
                errors = {}
                for field, errors_list in original_data.items():
                    if isinstance(errors_list, list):
                        errors[field] = [str(e) for e in errors_list]
                    else:
                        errors[field] = str(errors_list)
                code = 'VALIDATION_ERROR'
                message = 'Data yang dikirim tidak valid.'
                response.data = {
                    'status': 'error',
                    'code': code,
                    'message': message,
                    'errors': errors,
                }
                return response
        elif isinstance(original_data, list):
            message = ', '.join([str(e) for e in original_data])

        response.data = {
            'status': 'error',
            'code': code,
            'message': message,
        }

    return response

