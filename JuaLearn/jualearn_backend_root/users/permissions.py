from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminTeacherOrReadOnlyForStudent(BasePermission):
    """
    Custom permission:
    - Allow POST requests for unauthenticated access (e.g., registration)
    - Allow full access to authenticated admin, teacher, or staff users
    - Allow read-only access to students
    """
    
    def has_permission(self, request, view):
        # Allow unrestricted access to POST (e.g., registration endpoints)
        if request.method == 'POST':
            return True

        user = request.user

        # Block unauthenticated access (except POST above)
        if not user or not user.is_authenticated:
            return False

        # Allow access for admin or superuser
        if user.is_staff or user.is_superuser:
            return True

        # Allow full access to teachers and admins
        if getattr(user, "role", None) in ['admin', 'teacher']:
            return True

        # Allow read-only access to students
        if user.role == 'student' and request.method in SAFE_METHODS:
            return True

        # Otherwise deny access
        return False
