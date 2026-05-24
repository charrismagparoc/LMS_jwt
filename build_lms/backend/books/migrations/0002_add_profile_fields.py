from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='member',
            name='member_type',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='member',
            name='bio',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='member',
            name='photo_b64',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='member',
            name='profile_updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
