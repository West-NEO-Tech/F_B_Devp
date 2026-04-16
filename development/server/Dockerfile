# ---- Builder stage ----
FROM python:3.13-slim AS builder

WORKDIR /build

# Copy full source first so `pip install .` can find the app package
COPY . .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

# ---- Runtime stage ----
FROM python:3.13-slim AS runtime

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY --from=builder /usr/local/bin/alembic /usr/local/bin/alembic
COPY --from=builder /build .

EXPOSE 8100

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
