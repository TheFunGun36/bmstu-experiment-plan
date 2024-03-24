use axum::{routing::{get, post}, Router};
pub mod model;
pub mod api;

#[tokio::main(flavor = "multi_thread", worker_threads = 8)]
async fn main() {
    let app = Router::new()
        .route("/hello", get("Hello, world!"))
        .route("/model", post(api::model_single))
        .route("/model/generator_spread", post(api::model_spread_from_generator))
        .route("/model/service_spread", post(api::model_spread_from_service))
        .layer(tower_http::cors::CorsLayer::permissive());
    let listener = tokio::net::TcpListener::bind("localhost:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
