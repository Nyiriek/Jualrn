from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static
from users.views import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

def home(request):
    return HttpResponse("Welcome to JuaLearn API")

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# The development server must expose uploaded profile pictures for the frontend
# avatar to load them. Production deployments should serve MEDIA_URL through
# their configured media storage/CDN instead.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
