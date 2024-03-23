use axum::{routing::{get, post}, Router};
pub mod model;
pub mod api;

#[tokio::main()]
async fn main() {
    let app = Router::new()
        .route("/hello", get("Hello, world!"))
        .route("/model", post(api::model_single))
        .layer(tower_http::cors::CorsLayer::permissive());
    let listener = tokio::net::TcpListener::bind("localhost:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
