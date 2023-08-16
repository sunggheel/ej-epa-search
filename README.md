# epa-search
A simple website where you can search for declassified EPA related documents.

### Deployment:
To deploy, clone the repository then fill out the .envtemplate file and rename it to .env.
Then copy the frontend to be served from nginx using these commands:
```
cd epa-search
cp -r frontend/* /var/www/html
```

The elastic username is **elastic**. To find the elasticsearch password, run these commands and the new password will be pasted into the terminal.
```
docker exec -it <container_name_or_id> bash
cd /usr/share/elasticsearch/bin/
./elasticsearch-reset-password
```

If elasticsearch docker container crashes with exit code 78, it might be a memory error. Try this command:
```
sudo sysctl -w vm.max_map_count=262144
```


### Restarting the container & server
If you reboot the machine, you will have to manually restart the elasticsearch container and the express server api.
Container
```
docker start es01
```
Express server
```
tmux new-session -s api
cd epa-search
node index.js
```
After starting the express server in a tmux session, you can either exit the terminal, or press CTRL+B then D to exit the tmux session. CAUTION: be careful not to accidently stop the express server when you do this.

### Adding a new collection:
Files to change:
* .env
  * add the collection name, folder id, and sheet id (follow the naming convention)
* frontend/index.html
  * add the new collection to the dropdown list (line 74)
* frontend/index.js
  * add the new collection name on the dropdown onclick setters (line 288)
* elastic/indexIterator.js
  * add the new collection name to the iterator util (use process.env)
