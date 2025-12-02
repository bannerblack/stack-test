error.rs
```rust
// Custom Error Handling

#[derive(Debug)]
pub enum MyError {
    RedError,
    BlueError,
}

impl std::error::Error for MyError {}

impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RedError::SmallError => write!(f, "A red error occurred"),
            BlueError::LongerError => write!(f, "A blue error occurred"),
        }
    }
}
```

main.rs
```rust
mod error;
use error::MyError;

fn blue_func(should_fail: bool) -> Result<(), MyError> {
    if should_fail {
        Err(MyError::BlueError)
    } else {
        Ok(())
    }
}

fn longer_runner() -> Result<(), MyError> {
    blue_func(false)?;
    blue_func(true)?;

    Ok(())
}

fn print_report() {
    println!("Generating report...");
}

fn main() -> Result<(), MyError> {
    let short_result = longer_runner();

    match &short_result {
        Ok(()) => {
            print_report();
        }
        Err(e) => {
	        Err(MyError:RedError)
        }
    }
}
```