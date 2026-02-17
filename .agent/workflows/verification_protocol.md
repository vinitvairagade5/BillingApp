---
description: Mandatory verification steps to run after every code modification.
---

# Verification Protocol

After ANY code modification, you MUST perform the following steps to ensure stability:

1. **Build the Application**
   - Run `npm run build` (or equivalent) to catch compilation errors.
   - If the build fails, fix the errors immediately.

2. **Verify UI & API**
   - **UI**: Visually verify the changes if possible (browse the file structure, check templates). If a browser tool is available and relevant, use it to capture a screenshot.
   - **API**: Ensure any new service calls match the backend signatures.

3. **Run Unit Tests**
   - Run `npm run test -- --watch=false` (or equivalent).
   - Ensure all tests pass. If tests fail, fix the code or update the tests if the logic change was intentional.

4. **Docker Verification (If Applicable)**
   - If running in Docker, verify containers are healthy: `docker ps`.
   - Check logs for errors: `docker-compose logs`.

5. **Public Access Verification (If Applicable)**
   - If `start-public.bat` is used, verify the tunnel URL is accessible.

// turbo-all
