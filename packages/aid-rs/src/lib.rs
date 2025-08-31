pub mod errors;
pub mod record;
pub mod parser;

pub mod constants_gen;

pub use errors::AidError;
pub use record::AidRecord;
pub use parser::parse;

#[cfg(feature = "handshake")]
pub mod pka;

#[cfg(feature = "handshake")]
pub use pka::perform_pka_handshake;
