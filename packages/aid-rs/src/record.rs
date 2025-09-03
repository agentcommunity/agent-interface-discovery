#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AidRecord {
    pub v: String,
    pub uri: String,
    pub proto: String,
    pub auth: Option<String>,
    pub desc: Option<String>,
    pub docs: Option<String>,
    pub dep: Option<String>,
    pub pka: Option<String>,
    pub kid: Option<String>,
}
