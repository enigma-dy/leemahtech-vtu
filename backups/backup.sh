#!/bin/sh
set -e

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Dump and compress PostgreSQL database
echo "==> Dumping PostgreSQL..."
pg_dump -h db -U postgres leemahDb | gzip > "$BACKUP_DIR/leemahDb.sql.gz"

# Copy Loki logs
echo "==> Copying Loki logs..."
cp -r /loki-data "$BACKUP_DIR/loki"

# Upload to Google Drive
echo "==> Uploading to Google Drive..."
rclone --config /config/rclone/rclone.conf copy "$BACKUP_DIR" gdrive:docker-backups/$TIMESTAMP

# Rotate old backups
echo "==> Cleaning old local backups..."
find /backups -type d -mtime +7 -exec rm -rf {} +

echo "==> Backup completed at $TIMESTAMP"
