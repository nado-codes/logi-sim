using UnityEngine;

[RequireComponent(typeof(Camera))]
public class Flycam : MonoBehaviour
{
    [Header("Movement")]
    [Tooltip("Base movement speed in units per second.")]
    public float baseSpeed = 10f;

    [Tooltip("How quickly sprint speed ramps up while Shift is held (units per second per second).")]
    public float acceleration = 15f;

    [Tooltip("Maximum speed cap while sprinting.")]
    public float maxSprintSpeed = 80f;

    [Header("Look")]
    [Tooltip("Mouse sensitivity for free-look (right mouse button).")]
    public float lookSensitivity = 2f;

    [Tooltip("Clamp for vertical pitch in degrees.")]
    public float pitchClamp = 89f;

    [Tooltip("Invert the Y axis when free-looking.")]
    public bool invertY = false;

    // Internal state
    private float currentSprintSpeed;
    private float yaw;
    private float pitch;

    void Start()
    {
        // Initialise rotation state from current transform so we don't snap on first input
        Vector3 euler = transform.eulerAngles;
        yaw = euler.y;
        pitch = euler.x;

        currentSprintSpeed = baseSpeed;
    }

    void Update()
    {
        HandleLook();
        HandleMovement();
    }

    private void HandleLook()
    {
        // Right mouse button held = free look
        if (Input.GetMouseButton(1))
        {
            float mouseX = Input.GetAxis("Mouse X") * lookSensitivity;
            float mouseY = Input.GetAxis("Mouse Y") * lookSensitivity;

            yaw += mouseX;
            pitch += invertY ? mouseY : -mouseY;
            pitch = Mathf.Clamp(pitch, -pitchClamp, pitchClamp);

            transform.rotation = Quaternion.Euler(pitch, yaw, 0f);
        }
    }

    private void HandleMovement()
    {
        // Forward/back: W/S or Up/Down arrows. Opposing keys cancel.
        int forwardInput = 0;
        if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) forwardInput += 1;
        if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) forwardInput -= 1;

        // Strafe: A/D or Left/Right arrows. Opposing keys cancel.
        int strafeInput = 0;
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) strafeInput += 1;
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) strafeInput -= 1;

        bool anyInput = forwardInput != 0 || strafeInput != 0;

        // Sprint ramp: only accumulates while moving + shift held; resets the moment you let go of input
        if (anyInput && (Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift)))
        {
            currentSprintSpeed += acceleration * Time.deltaTime;
            currentSprintSpeed = Mathf.Min(currentSprintSpeed, maxSprintSpeed);
        }
        else
        {
            currentSprintSpeed = baseSpeed;
        }

        // No input = instant stop. No drift, no smoothing.
        if (!anyInput) return;

        // Build local-space direction, then transform by camera orientation so W = where we're looking
        Vector3 direction = new Vector3(strafeInput, 0f, forwardInput).normalized;
        Vector3 worldMove = transform.rotation * direction;

        transform.position += worldMove * currentSprintSpeed * Time.deltaTime;
    }
}