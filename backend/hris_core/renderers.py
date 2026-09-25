"""
Standard JSON Renderer untuk semua response API HRIS OmahVisual.

Format sukses:
    {"status": "success", "data": {...}}

Format error (ditangani oleh custom_exception_handler):
    {"status": "error", "code": "...", "message": "..."}
"""

from rest_framework.renderers import JSONRenderer
import json


class StandardJSONRenderer(JSONRenderer):
    """
    Membungkus semua response sukses dalam format standar:
    {"status": "success", "data": <original_data>}
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None

        # Jika response adalah error (4xx/5xx), biarkan exception handler yang menangani
        if response and response.status_code >= 400:
            return super().render(data, accepted_media_type, renderer_context)

        # Bungkus data sukses
        wrapped = {
            'status': 'success',
            'data': data,
        }
        return super().render(wrapped, accepted_media_type, renderer_context)

