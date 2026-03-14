import paramiko
import sys

# Connect to the remote server
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('192.168.1.5', username='chinu', password='123')
    
    # Run the SQL migration using docker exec
    query = 'ALTER TABLE "Bills" ADD COLUMN IF NOT EXISTS "OriginalBillId" INTEGER NULL;'
    cmd = f'echo "123" | sudo -S docker exec billing-db psql -U postgres -d billing_app -c \'{query}\''
    
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())
    
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
