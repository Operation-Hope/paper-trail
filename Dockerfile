FROM python:3.13-alpine

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV FLASK_ENV=production

COPY requirements.txt .

RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    postgresql-dev \
    python3-dev \
    && pip install --no-cache-dir -r requirements.txt \
    && apk del .build-deps \
    && rm -rf /var/cache/apk/* /tmp/*


COPY . .

RUN adduser -D -u 1000 flaskuser && \
    chown -R flaskuser:flaskuser /app

USER flaskuser

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app.main:app", "--workers", "4", "--access-logfile", "-", "--error-logfile", "-", "--timeout", "120"]
EXPOSE 5000
