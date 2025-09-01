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

#[cfg(feature = "handshake")]
pub mod well_known;

#[cfg(feature = "handshake")]
pub use well_known::fetch_well_known;

pub mod discover;
pub use discover::{discover, discover_with_options, DiscoveryOptions};
