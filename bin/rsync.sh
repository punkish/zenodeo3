# Run this program from the app root directly like so
# 
# ~/Projects/zenodeo3$ bin/rsync.sh
# 
# Or install it as a cron job.
# The following crontab entry runs this shell script 30 mins after midnight.
# Create a crontab entry with `crontab -e` and type the lines 
# between 'begin:' and 'end:' (without the leading #)
#
# -------- begin: crontab entry ------------------------
# HOME=/Users/punkish
# APPDIR=Projects/zenodeo/zenodeo3
# 30 0 * * * cd $HOME/$APPDIR && bin/rsync.sh
# -------- end: crontab entry --------------------------

EXCLUDES="./bin/exclude-rsync.txt"
SRC="./data"
TGT="lko:/home/punkish/Projects/zenodeo3"
rsync -azvv --exclude-from=$EXCLUDES $SRC $TGT