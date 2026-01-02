#!/bin/bash
cd /c/ieu/sources/whodunit-party
export CYPRESS_BASE_URL=http://localhost:3001
npx cypress run --spec cypress/e2e/gameplay/multi-player-voting.feature
