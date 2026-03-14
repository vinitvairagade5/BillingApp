# Execute SQL on Postgres via Docker
ssh chinu@192.168.1.5 << 'EOF_SSH'
  cat << 'EOF_SQL' > m.sql
    ALTER TABLE "Bills" ADD COLUMN IF NOT EXISTS "OriginalBillId" INTEGER NULL;
EOF_SQL
  echo '123' | sudo -S docker exec -i billing-db psql -U postgres -d billing_app < m.sql
EOF_SSH
