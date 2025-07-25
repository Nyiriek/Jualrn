from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
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
