error.rs
```rust
#[derive(Debug)]
pub enum MyError {
    SmallError,
    LongerError,
}

impl std::error::Error for MyError {}

impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MyError::SmallError => write!(f, "A small error occurred"),
            MyError::LongerError => write!(f, "A longer error occurred"),
        }
    }
}
```

main.rs
```rust
mod error;
use error::MyError;

fn small_func(should_fail: bool) -> Result<(), MyError> {
    if should_fail {
        Err(MyError::SmallError)
    } else {
        Ok(())
    }
}

fn print_report() {
    println!("Generating report...");
}

fn longer_runner() -> Result<(), MyError> {
    small_func(false)?;
    small_func(true)?;

    Ok(())
}

fn main() {
    let short_result = longer_runner();

    match &short_result {
        Ok(()) => {
            print_report();
        }
        Err(e) => println!("Error: {}", e),
    }
}

```