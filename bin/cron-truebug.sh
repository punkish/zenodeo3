# This crontab entry runs the following shell script every midnight.
# Create a crontab entry with `crontab -e` and type the lines 
# between 'begin:' and 'end:' (without the leading #)
#
# -------- begin: crontab entry ------------------------
# HOME=/Users/punkish
# APPDIR=Projects/zenodeo/zenodeo3
# 0 0 * * * cd $HOME/$APPDIR && bin/cron-truebug.sh
# -------- end: crontab entry --------------------------

# set a couple of environment variables
export NVM_DIR="$HOME/.nvm"
export NODE_ENV=cron

# load nvm
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  

# load nvm bash_completion
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  

# run truebug with arg 'etl'
node bin/truebug/index.js etl
