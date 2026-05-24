from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0004_emailverification'),
    ]

    operations = [
        migrations.CreateModel(
            name='KnowledgeBase',
            fields=[
                ('id',           models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title',        models.CharField(max_length=255)),
                ('text_content', models.TextField(blank=True, null=True)),
                ('created_at',   models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['title']},
        ),
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role',       models.CharField(choices=[('user', 'User'), ('assistant', 'Assistant')], max_length=20)),
                ('message',    models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['created_at']},
        ),
    ]
