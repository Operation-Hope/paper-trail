REPOSITORY TREE
```
paper-trail/
├── .dev.env
├── .gitignore
├── README.md
├── requirements.txt
├── app/
└── ├── __init__.py
    ├── config.py
    ├── main.py
    └── templates/
        ├──.gitkeep
        ├── donor_search.html
        └── index.html
└── bin/
    ├── bootstrap.sql
    ├── build_fec_map.py
    ├── load_sql.py
    ├── populate_bills.py
    ├── populate_donors_and_donations.py
    ├── populate_industries.py
    ├── populate_politicians.py
    ├── populate_votes.py
    └── sql_data.tar.bz2
  
```

## Local dev set up instructions

**todo** add postgres install or container install instructions and .env

Create and activate virtual environment

`python -m venv env`

linux/mac   
`source env/bin/activate`  

windows  
`source env/Scripts/activate`

install requirements  
`pip install -r requirements.txt`  

rename `.dev.env` > `.env` and update with your local values.

launch application  
`python -m app.main`

### Pod Containers for deployment

```bash
echo "paper-trail build image"
podman build -t paper-trail -f Dockerfile

echo "Create pod pod-paper-trail"
podman pod create -p 5000:5000 --name=pod-paper-trail \
&& \
podman pod start pod-paper-trail

podman run -d --pod=pod-paper-trail \
    --name=paper_trail_db \
    -v paper-trail-data:/var/lib/postgresql/data \
    --secret DB_NAME,type=env,target=POSTGRES_DB \
    --secret DB_HOST,type=env,target=POSTGRES_SERVER \
    --secret DB_PORT,type=env,target=POSTGRES_PORT \
    --secret DB_USER,type=env,target=POSTGRES_USER \
    --secret DB_PASSWORD,type=env,target=POSTGRES_PASSWORD \
    docker.io/postgres:latest

podman run --rm -d --pod=pod-paper-trail --name=paper-trail \
    -p 5000:5000 \
    --secret DB_NAME,type=env,target=DB_NAME \
    --secret DB_HOST,type=env,target=DB_HOST \
    --secret DB_PORT,type=env,target=DB_PORT \
    --secret DB_USER,type=env,target=DB_USER \
    --secret DB_PASSWORD,type=env,target=DB_PASSWORD \
    paper-trail

```