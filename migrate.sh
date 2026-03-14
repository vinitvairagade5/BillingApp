#!/bin/bash
sshpass -p '123' ssh chinu@192.168.1.5 "cat << 'EOF' > m.sql
ALTER TABLE \"Bills\" ADD COLUMN IF NOT EXISTS \"OriginalBillId\" INTEGER NULL;
EOF
echo '123' | sudo -S docker exec -i billing-db psql -U postgres -d billing_app < m.sql
"
