using System;

public static class MathUtils
{
    public static float Distance(float x1, float y1, float z1, 
                              float x2, float y2, float z2)
    {
        float dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
        return MathF.Sqrt(dx * dx + dy * dy + dz * dz);
    }
}