from rest_framework import permissions

class IsTeacherOrReadOnly(permissions.BasePermission):
    """
    Allow only teachers to create/update/delete. Students can only view.
    """

    def has_permission(self, request, view):
        # SAFE_METHODS are GET, HEAD, OPTIONS (viewing)
        if request.method in permissions.SAFE_METHODS:
            return True
        # Otherwise, must be authenticated and a teacher
        return request.user.is_authenticated and request.user.role == 'teacher'
