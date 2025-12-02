# This crontab entry runs the following shell script every midnight.
# Create a crontab entry with `crontab -e` and type the lines 
# between 'begin:' and 'end:' (without the leading #)
#
# -------- begin: crontab entry ------------------------
# 0 0 * * * ~/Projects/zenodeo3/bin/cron-newbug.sh
# -------- end: crontab entry --------------------------

# run newbug with default args etl --action=etl --source=tb 
APPDIR=Projects/zenodeo3
export NODE_ENV=cron
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd $HOME/$APPDIR
node bin/newbug/index.js --action=etl --source=tb