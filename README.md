# search-db
A simple website where you can search the NEJAC minutes database.

Deployment:
To deploy, clone the repository then fill out the .envtemplate file and rename it to .env.
Then copy the frontend to be served from nginx using thse commands:
```
cd epa-search
cp -r frontend/* /var/www/html
```


If elasticsearch docker container crashes with exit code 78, try this command:
```
sudo sysctl -w vm.max_map_count=262144
```