from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0002_add_profile_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='member',
            name='address',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='member',
            name='birthday',
            field=models.DateField(null=True, blank=True),
        ),
    ]
