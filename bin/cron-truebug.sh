# This crontab entry runs the following shell script every midnight.
# Create a crontab entry with `crontab -e` and type the lines 
# between 'begin:' and 'end:' (without the leading #)
#
# -------- begin: crontab entry ------------------------
# 0 0 * * * ~/Projects/zenodeo3/bin/cron-truebug.sh
# -------- end: crontab entry --------------------------

# run truebug with default args etl --mode=real 
# the latter picked up from config
APPDIR=Projects/zenodeo3
export NODE_ENV=cron
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd $HOME/$APPDIR
node bin/truebug/index.js --do=etl