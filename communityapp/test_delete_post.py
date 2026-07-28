import requests

# Adjust these as needed for your environment
BASE_URL = "http://127.0.0.1:8000/community/api/posts/"
POST_ID = 1  # Change to a valid post ID for your test
TOKEN = "YOUR_AUTH_TOKEN"  # Replace with a valid token

def test_delete_post():
    url = f"{BASE_URL}{POST_ID}/delete/"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = requests.delete(url, headers=headers)
    print("Status Code:", response.status_code)
    print("Response:", response.json())

if __name__ == "__main__":
    test_delete_post()
