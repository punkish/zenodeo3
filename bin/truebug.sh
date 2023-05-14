# Run this program from the app root directly like so
# 
# ~/Projects/zenodeo3$ bin/truebug.sh
# 
# This crontab entry runs the following shell script every midnight.
# Create a crontab entry with `crontab -e` and type the lines 
# between 'begin:' and 'end:' (without the leading #)
#
# -------- begin: crontab entry ------------------------
# HOME=/Users/punkish
# APPDIR=Projects/zenodeo/zenodeo3
# export NODE_ENV=cron
# #### load nvm
# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# #### load nvm bash_completion
# [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" 
# 0 0 * * * cd $HOME/$APPDIR && bin/truebug.sh
# -------- end: crontab entry --------------------------

# run truebug with default args etl --mode=real 
# the latter picked up from config
node bin/truebug/index.js