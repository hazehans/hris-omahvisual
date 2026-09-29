def log_action(request, action, target_type=None, target_id=None, detail=None):
    """Log an audit action. Can be called from any view."""
    from .models import AuditLog
    ip = get_client_ip(request)
    AuditLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        detail=detail,
        ip_address=ip,
    )

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
