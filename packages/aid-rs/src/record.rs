#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AidRecord {
    pub v: String,
    pub uri: String,
    pub proto: String,
    pub auth: Option<String>,
    pub desc: Option<String>,
}