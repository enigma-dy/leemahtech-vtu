#!/bin/sh
set -e

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/backups/$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

echo "==> Dumping PostgreSQL database..."
pg_dump -h db -U postgres appdb > "$BACKUP_DIR/db.sql"

echo "==> Copying Loki logs..."
cp -r /loki-data "$BACKUP_DIR/loki"

echo "==> Uploading to Google Drive..."
rclone copy "$BACKUP_DIR" gdrive:docker-backups/$TIMESTAMP

echo "==> Cleaning old local backups..."
find /backups -type d -mtime +7 -exec rm -rf {} +

echo "==> Backup completed at $TIMESTAMP"
