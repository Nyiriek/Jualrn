from django.contrib import admin
from .models import User, Subject, Assignment

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'created_by', 'assigned_to', 'due_date', 'grade')
    search_fields = ('title',)
    list_filter = ('subject', 'created_by', 'assigned_to', 'due_date', 'grade')
    raw_id_fields = ('created_by', 'assigned_to')
    autocomplete_fields = ('created_by', 'assigned_to', 'subject')
    list_per_page = 2
    date_hierarchy = 'due_date'
    ordering = ('due_date', 'title')
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'subject', 'created_by', 'due_date', 'grade')
        }),
    )