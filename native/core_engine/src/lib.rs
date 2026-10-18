use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct UserContract {
    pub id: String,
    pub name: String,
    pub email: String,
}

pub fn validate_user(contract_json: &str) -> Result<UserContract, serde_json::Error> {
    serde_json::from_str::<UserContract>(contract_json)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_deserialization() {
        let json_data = r#"{"id":"123","name":"Ghofur","email":"ghofur@example.com"}"#;
        let result = validate_user(json_data).unwrap();
        assert_eq!(result.name, "Ghofur");
    }
}
