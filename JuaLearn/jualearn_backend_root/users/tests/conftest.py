import pytest
import django

@pytest.fixture(scope='session', autouse=True)
def django_setup():
    django.setup()
